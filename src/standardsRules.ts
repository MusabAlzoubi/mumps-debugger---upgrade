import * as vscode from 'vscode';

export type StandardsProfile = 'off' | 'vista' | 'ujo' | 'custom';

export interface StandardsSettings {
	profile: StandardsProfile;
	enforceRoutineHeader: boolean;
	namespacePrefixes: string[];
}

export interface StandardsIssue {
	message: string;
	severity: vscode.DiagnosticSeverity;
	range: vscode.Range;
	source: string;
}

export function readStandardsSettings(): StandardsSettings {
	const configuration = vscode.workspace.getConfiguration('mumps');
	const profile = (configuration.get<string>('standards.profile', 'off') || 'off').toLowerCase() as StandardsProfile;
	const enforceRoutineHeader = configuration.get<boolean>('standards.enforceRoutineHeader', false) ?? false;
	const namespacePrefixes = configuration.get<string[]>('standards.namespacePrefixes', []);
	return {
		profile,
		enforceRoutineHeader,
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
					source: 'mumps-standards'
				};
			}
		}
		if (!line.includes(';;')) {
			return {
				message: 'Routine header is missing standard metadata separator (;;).',
				severity: vscode.DiagnosticSeverity.Information,
				range: new vscode.Range(i, 0, i, routineName.length),
				source: 'mumps-standards'
			};
		}
		return undefined;
	}
	return undefined;
}
