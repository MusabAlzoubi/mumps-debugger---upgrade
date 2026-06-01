import * as vscode from 'vscode';
import { createPatchChangeBlockTemplate, createRoutineHeaderTemplate } from './templateEngine';

export async function insertRoutineHeaderTemplate(): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (!editor || editor.document.languageId !== 'mumps') {
		return;
	}
	const routineName = editor.document.fileName.split(/[\\/]/).pop()?.split('.')[0] || 'UJOROUT';
	const namespace = await vscode.window.showInputBox({ prompt: 'Namespace', value: 'UJO' });
	if (!namespace) {
		return;
	}
	const author = await vscode.window.showInputBox({ prompt: 'Author initials', value: 'DEV' });
	if (!author) {
		return;
	}
	const description = await vscode.window.showInputBox({ prompt: 'Routine short description', value: 'Routine description' });
	if (!description) {
		return;
	}
	const today = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();
	const header = createRoutineHeaderTemplate({
		routineName,
		company: 'EHS',
		author,
		description,
		version: '2.0',
		namespace: namespace.toUpperCase(),
		patch: '1',
		date: today,
		build: '1'
	});
	await editor.edit(editBuilder => {
		editBuilder.insert(new vscode.Position(0, 0), header + '\n');
	});
}


export async function insertPatchChangeBlockTemplate(): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (!editor || editor.document.languageId !== 'mumps') {
		return;
	}
	const patch = await vscode.window.showInputBox({ prompt: 'Patch name and number (for example: UJO*2.0*30)', value: 'UJO*2.0*1' });
	if (!patch) {
		return;
	}
	const author = await vscode.window.showInputBox({ prompt: 'Programmer initials separated by /', value: 'DEV' });
	if (!author) {
		return;
	}
	const fixType = await vscode.window.showQuickPick(['Addition', 'Update', 'Delete', 'Comment'], { placeHolder: 'Fix type' });
	if (!fixType) {
		return;
	}
	const reason = await vscode.window.showInputBox({ prompt: 'Fix reason or short title', value: 'Change reason' });
	if (!reason) {
		return;
	}
	const scope = await vscode.window.showInputBox({ prompt: 'Scope (optional)', value: '' });
	const today = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();
	const block = createPatchChangeBlockTemplate({
		company: 'EHS',
		author,
		patch,
		date: today,
		fixType,
		reason,
		scope
	});
	await editor.edit(editBuilder => {
		editBuilder.insert(editor.selection.active, block);
	});
}
