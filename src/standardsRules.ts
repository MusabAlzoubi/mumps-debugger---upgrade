import * as vscode from 'vscode';
import { LineToken, MumpsLineParser, TokenType } from './mumpsLineParser';

export type StandardsProfile = 'off' | 'vista' | 'ujo' | 'custom';

export interface StandardsSettings {
	profile: StandardsProfile;
	enforceRoutineHeader: boolean;
	enforceLabelLength: boolean;
	enforceLocalVariableNames: boolean;
	namespacePrefixes: string[];
}

export interface StandardsIssue {
	message: string;
	severity: vscode.DiagnosticSeverity;
	range: vscode.Range;
	source: string;
}

const parser = new MumpsLineParser();
const source = 'mumps-standards';

export function readStandardsSettings(): StandardsSettings {
	const configuration = vscode.workspace.getConfiguration('mumps');
	const profile = (configuration.get<string>('standards.profile', 'off') || 'off').toLowerCase() as StandardsProfile;
	const enforceRoutineHeader = configuration.get<boolean>('standards.enforceRoutineHeader', false) ?? false;
	const enforceLabelLength = configuration.get<boolean>('standards.enforceLabelLength', true) ?? true;
	const enforceLocalVariableNames = configuration.get<boolean>('standards.enforceLocalVariableNames', true) ?? true;
	const namespacePrefixes = configuration.get<string[]>('standards.namespacePrefixes', []);
	return {
		profile,
		enforceRoutineHeader,
		enforceLabelLength,
		enforceLocalVariableNames,
		namespacePrefixes
	};
}

export function analyzeStandards(document: vscode.TextDocument, settings: StandardsSettings): StandardsIssue[] {
	if (settings.profile === 'off') {
		return [];
	}
	const issues: StandardsIssue[] = [];
	if (settings.enforceRoutineHeader) {
		const issue = checkRoutineHeader(document, settings);
		if (issue) {
			issues.push(issue);
		}
	}
	for (let i = 0; i < document.lineCount; i++) {
		const lineInfo = parser.analyzeLine(document.lineAt(i).text);
		if (settings.enforceLabelLength) {
			issues.push(...checkLabelLength(i, lineInfo.tokens));
		}
		if (settings.enforceLocalVariableNames) {
			issues.push(...checkLocalVariableNames(i, lineInfo.tokens));
		}
	}
	return issues;
}

function checkRoutineHeader(document: vscode.TextDocument, settings: StandardsSettings): StandardsIssue | undefined {
	for (let i = 0; i < document.lineCount; i++) {
		const line = document.lineAt(i).text.trim();
		if (line.length === 0 || line.startsWith(';')) {
			continue;
		}
		const routineName = line.split(/[\s(]/)[0];
		if (!routineName) {
			return undefined;
		}
		if (settings.namespacePrefixes.length > 0) {
			const matchesNamespace = settings.namespacePrefixes.some(prefix => routineName.toUpperCase().startsWith(prefix.toUpperCase()));
			if (!matchesNamespace) {
				return {
					message: `Routine name '${routineName}' does not match allowed namespace prefixes: ${settings.namespacePrefixes.join(', ')}`,
					severity: vscode.DiagnosticSeverity.Warning,
					range: new vscode.Range(i, 0, i, routineName.length),
					source
				};
			}
		}
		if (!line.includes(';;')) {
			return {
				message: 'Routine header is missing standard metadata separator (;;).',
				severity: vscode.DiagnosticSeverity.Information,
				range: new vscode.Range(i, 0, i, routineName.length),
				source
			};
		}
		return undefined;
	}
	return undefined;
}

function checkLabelLength(line: number, tokens: LineToken[]): StandardsIssue[] {
	const issues: StandardsIssue[] = [];
	for (const token of tokens) {
		if (token.type === TokenType.label && token.name.length > 8) {
			issues.push({
				message: `Entry point '${token.name}' exceeds the VistA label length limit of 8 characters.`,
				severity: vscode.DiagnosticSeverity.Warning,
				range: new vscode.Range(line, token.position, line, token.position + token.name.length),
				source
			});
		}
	}
	return issues;
}

function checkLocalVariableNames(line: number, tokens: LineToken[]): StandardsIssue[] {
	const issues: StandardsIssue[] = [];
	for (const token of tokens) {
		if (token.type !== TokenType.local) {
			continue;
		}
		if (token.name.length > 16) {
			issues.push({
				message: `Local variable '${token.name}' exceeds the VistA limit of 16 characters.`,
				severity: vscode.DiagnosticSeverity.Warning,
				range: new vscode.Range(line, token.position, line, token.position + token.name.length),
				source
			});
		}
		if (/[a-z]/.test(token.name)) {
			issues.push({
				message: `Local variable '${token.name}' contains lowercase characters; VistA standard expects uppercase local variables.`,
				severity: vscode.DiagnosticSeverity.Information,
				range: new vscode.Range(line, token.position, line, token.position + token.name.length),
				source
			});
		}
	}
	return issues;
}
