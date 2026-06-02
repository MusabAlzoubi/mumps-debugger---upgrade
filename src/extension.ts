'use strict';

import * as vscode from 'vscode';
import { autoSpaceEnter, autoSpaceTab } from './mumpsAutospace';
import { MumpsHighlighter, SemanticTokens } from './mumpsHighlighter';
import MumpsConfigurationProvider from './mumpsConfigurationProvider';
import MumpsDebugSession from './mumpsDebug';
import MumpsDocumentSymbolProvider from './mumpsDocumentSymbolProvider';
import MumpsDefinitionProvider from './mumpsDefinitionProvider';
import MumpsEvalutableExpressionProvider from './mumpsEvalutableExpressionProvider';
import MumpsFormattingHelpProvider from './mumpsFormattingHelpProvider';
import MumpsHoverProvider from './mumpsHoverProvider';
import MumpsReferenceProvider from './mumpsReferenceProvider';
import MumpsSignatureHelpProvider from './mumpsSignatureHelpProvider';
import MumpsDocumenter from './mumpsDocumenter';
import CompletionItemProvider from './mumpsCompletionItemProvider';
import expandCompress from './mumpsCompExp';
import MumpsDiagnosticsProvider from './mumpsDiagnosticsProvider';
import { insertPatchChangeBlockTemplate, insertRoutineHeaderTemplate } from './mumpsTemplateCommands';
import { clearDirectDebugOutput, configureZstepLinePrinting, copyLastDirectDebugOutput, directDebugSetup, directDebugSmokeTest, openDirectDebugOutput, registerDirectDebugControls, sendRawDebugCommand, showZposition, zbreak, zcontinue, zprint, zprintAtPos, zshow, zstep, zstepInto, zstepOutOf, zwrite } from './mumpsDirectDebugCommands';
import fs = require('fs');
let timeout: ReturnType<typeof setTimeout> | undefined;
const entryRef: string | undefined = "";
export async function activate(context: vscode.ExtensionContext) {

	const MUMPS_MODE: vscode.DocumentFilter = { language: 'mumps', scheme: 'file' };
	// register a configuration provider for 'mumps' debug type
	const mumpsDiagnostics = vscode.languages.createDiagnosticCollection("mumps");
	let storage = "";
	if (context.storageUri !== undefined) {
		storage = context.storageUri.fsPath;
		if (!fs.existsSync(storage)) {
			fs.mkdirSync(storage);
		}
		const dbFile = storage + "/labeldb.json";
		context.subscriptions.push(vscode.languages.registerCompletionItemProvider(MUMPS_MODE, new CompletionItemProvider(dbFile)));
	}
	const wsState = context.workspaceState;
	registerDirectDebugControls(context);
	context.subscriptions.push(
		vscode.commands.registerCommand("mumps.documentFunction", () => { MumpsDocumenter(); }),
		vscode.commands.registerCommand("mumps.autoSpaceEnter", () => { autoSpaceEnter(); }),
		vscode.commands.registerCommand("mumps.autoSpaceTab", () => { autoSpaceTab(); }),
		vscode.commands.registerCommand("mumps.toggleExpandedCommands", () => { expandCompress(wsState) }),
		vscode.commands.registerCommand('mumps.getEntryRef', () => { return getEntryRef() }),
		vscode.commands.registerCommand('mumps.insertRoutineHeaderTemplate', async () => { await insertRoutineHeaderTemplate(); }),
		vscode.commands.registerCommand('mumps.insertPatchChangeBlockTemplate', async () => { await insertPatchChangeBlockTemplate(); }),
		vscode.commands.registerCommand('mumps.zstep', async () => { await zstep(); }),
		vscode.commands.registerCommand('mumps.zcontinue', async () => { await zcontinue(); }),
		vscode.commands.registerCommand('mumps.zwrite', async () => { await zwrite(); }),
		vscode.commands.registerCommand('mumps.zshow', async () => { await zshow(); }),
		vscode.commands.registerCommand('mumps.zbreak', async () => { await zbreak(); }),
		vscode.commands.registerCommand('mumps.zprintAtPosition', async () => { await zprintAtPos(); }),
		vscode.commands.registerCommand('mumps.zprint', async () => { await zprint(); }),
		vscode.commands.registerCommand('mumps.zstepInto', async () => { await zstepInto(); }),
		vscode.commands.registerCommand('mumps.zstepOutOf', async () => { await zstepOutOf(); }),
		vscode.commands.registerCommand('mumps.configureZstepLinePrinting', async () => { await configureZstepLinePrinting(); }),
		vscode.commands.registerCommand('mumps.directDebugSetup', async () => { await directDebugSetup(); }),
		vscode.commands.registerCommand('mumps.directDebugSmokeTest', async () => { await directDebugSmokeTest(); }),
		vscode.commands.registerCommand('mumps.showZposition', async () => { await showZposition(); }),
		vscode.commands.registerCommand('mumps.sendRawDebugCommand', async () => { await sendRawDebugCommand(); }),
		vscode.commands.registerCommand('mumps.openDirectDebugOutput', () => { openDirectDebugOutput(); }),
		vscode.commands.registerCommand('mumps.copyLastDirectDebugOutput', async () => { await copyLastDirectDebugOutput(); }),
		vscode.commands.registerCommand('mumps.clearDirectDebugOutput', () => { clearDirectDebugOutput(); }),
		vscode.languages.registerHoverProvider(MUMPS_MODE, new MumpsHoverProvider()),
		vscode.languages.registerDefinitionProvider(MUMPS_MODE, new MumpsDefinitionProvider()),
		vscode.languages.registerEvaluatableExpressionProvider(MUMPS_MODE, new MumpsEvalutableExpressionProvider()),
		vscode.languages.registerSignatureHelpProvider(MUMPS_MODE, new MumpsSignatureHelpProvider(), '(', ','),
		vscode.languages.registerDocumentSymbolProvider(MUMPS_MODE, new MumpsDocumentSymbolProvider()),
		vscode.languages.registerDocumentSemanticTokensProvider(MUMPS_MODE, MumpsHighlighter, SemanticTokens),
		vscode.languages.registerDocumentFormattingEditProvider(MUMPS_MODE, new MumpsFormattingHelpProvider()),
		vscode.languages.registerDocumentRangeFormattingEditProvider(MUMPS_MODE, new MumpsFormattingHelpProvider()),
		vscode.languages.registerReferenceProvider(MUMPS_MODE, new MumpsReferenceProvider()),
		vscode.debug.registerDebugConfigurationProvider('mumps', new MumpsConfigurationProvider()),
		vscode.debug.registerDebugAdapterDescriptorFactory('mumps', new InlineDebugAdapterFactory()),
		vscode.window.onDidChangeActiveTextEditor(editor => { if (editor) { triggerUpdateDiagnostics(editor.document, mumpsDiagnostics) } }),
		vscode.workspace.onDidChangeTextDocument(editor => { if (editor) { triggerUpdateDiagnostics(editor.document, mumpsDiagnostics) } }),
		vscode.workspace.onDidOpenTextDocument(document => { triggerUpdateDiagnostics(document, mumpsDiagnostics) })
	);
	const config = vscode.workspace.getConfiguration('editor');
    config.update('formatOnSave', false, vscode.ConfigurationTarget.Global);
}

export function deactivate() {
	// nothing to do
}

class InlineDebugAdapterFactory implements vscode.DebugAdapterDescriptorFactory {

	createDebugAdapterDescriptor(): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
		return new vscode.DebugAdapterInlineImplementation(new MumpsDebugSession());
	}
}

function triggerUpdateDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection) {
	if (timeout) {
		clearTimeout(timeout);
		timeout = undefined;
	}
	timeout = setTimeout(() => new MumpsDiagnosticsProvider(document, collection), 500);
}

function getEntryRef() {
	return vscode.window.showInputBox({
		placeHolder: "Please enter the Entry-Reference to start Debugging",
		value: entryRef
	})
}

