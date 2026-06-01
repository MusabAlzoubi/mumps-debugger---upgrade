import * as vscode from 'vscode';

const outputChannel = vscode.window.createOutputChannel('MUMPS Debug');
const zbreakHistory: string[] = [];
let positionStatusItem: vscode.StatusBarItem | undefined;

interface RawCommandResponse {
	accepted?: boolean;
	command?: string;
	message?: string;
}

interface DirectDebugControl {
	text: string;
	tooltip: string;
	command: string;
	priority: number;
	isPosition?: boolean;
}

const directDebugControls: DirectDebugControl[] = [
	{ text: '$(debug-continue) ZC', tooltip: 'MUMPS: ZCONTINUE', command: 'mumps.zcontinue', priority: 200 },
	{ text: '$(debug-step-over) ZST', tooltip: 'MUMPS: ZSTEP', command: 'mumps.zstep', priority: 199 },
	{ text: '$(debug-step-into) INTO', tooltip: 'MUMPS: ZSTEP INTO', command: 'mumps.zstepInto', priority: 198 },
	{ text: '$(debug-step-out) OUT', tooltip: 'MUMPS: ZSTEP OUTOF', command: 'mumps.zstepOutOf', priority: 197 },
	{ text: '$(debug-breakpoint) ZB', tooltip: 'MUMPS: ZBREAK...', command: 'mumps.zbreak', priority: 196 },
	{ text: '$(code) ZP', tooltip: 'MUMPS: ZPRINT @$ZPOSITION', command: 'mumps.zprintAtPosition', priority: 195 },
	{ text: '$(symbol-variable) ZWR', tooltip: 'MUMPS: ZWRITE variables', command: 'mumps.zwrite', priority: 194 },
	{ text: '$(list-tree) ZSH', tooltip: 'MUMPS: ZSHOW stack/environment', command: 'mumps.zshow', priority: 193 },
	{ text: '$(settings-gear) $ZSTEP', tooltip: 'MUMPS: Configure $ZSTEP line printing', command: 'mumps.configureZstepLinePrinting', priority: 192 },
	{ text: '$(location) $ZPOS', tooltip: 'MUMPS: Show $ZPOSITION', command: 'mumps.showZposition', priority: 191, isPosition: true }
];

function shouldShowOutput(): boolean {
	return vscode.workspace.getConfiguration('mumps').get<boolean>('debug.showOutputOnCommand', true) ?? true;
}

function appendOutput(message: string, forceShow = false): void {
	outputChannel.appendLine(message);
	if (forceShow || shouldShowOutput()) {
		outputChannel.show(true);
	}
}

function logCommand(command: string, label?: string): void {
	const timestamp = new Date().toISOString();
	appendOutput(`[${timestamp}] ${label ? label + ': ' : ''}${command}`);
}

function directCommandTimeoutMs(): number {
	return vscode.workspace.getConfiguration('mumps').get<number>('debug.directCommandTimeoutMs', 5000) ?? 5000;
}

function appendCommandResult(command: string, label: string | undefined, message: string): void {
	appendOutput(`--- ${label || 'MUMPS Direct Command'} result ---`);
	appendOutput(`Command: ${command}`);
	appendOutput((message || 'MDEBUG command completed with no output.').trim());
	appendOutput('--- end result ---');
}

function isLikelyEntryReference(target: string): boolean {
	return /^[A-Za-z%][A-Za-z0-9%]*(\+\d+)?\^[A-Za-z%][A-Za-z0-9%]*$/.test(target.trim());
}

function rememberZbreakTarget(target: string): void {
	const existingIndex = zbreakHistory.indexOf(target);
	if (existingIndex >= 0) {
		zbreakHistory.splice(existingIndex, 1);
	}
	zbreakHistory.unshift(target);
	while (zbreakHistory.length > 5) {
		zbreakHistory.pop();
	}
}

async function pickZbreakTarget(): Promise<string | undefined> {
	if (zbreakHistory.length === 0) {
		return vscode.window.showInputBox({
			prompt: 'ZBREAK target (for example: TEST+3^KJOTEST)',
			placeHolder: 'TAG+OFFSET^ROUTINE'
		});
	}
	const selected = await vscode.window.showQuickPick([
		{ label: '$(edit) Enter a new ZBREAK target', target: undefined },
		...zbreakHistory.map(target => ({ label: target, target }))
	], { placeHolder: 'Select a recent ZBREAK target or enter a new one' });
	if (!selected) {
		return undefined;
	}
	if (selected.target) {
		return selected.target;
	}
	return vscode.window.showInputBox({
		prompt: 'ZBREAK target (for example: TEST+3^KJOTEST)',
		placeHolder: 'TAG+OFFSET^ROUTINE'
	});
}

async function sendDebugCommand(command: string, label?: string): Promise<RawCommandResponse | undefined> {
	const session = vscode.debug.activeDebugSession;
	if (!session || session.type !== 'mumps') {
		const message = 'No active MUMPS debug session.';
		appendOutput(`[warning] ${message}`, true);
		vscode.window.showWarningMessage(message);
		return undefined;
	}
	logCommand(command, label);
	try {
		const response = await session.customRequest('mumps.rawCommand', { command, timeoutMs: directCommandTimeoutMs() }) as RawCommandResponse | undefined;
		if (response?.message) {
			appendCommandResult(command, label, response.message);
		} else {
			appendCommandResult(command, label, `MDEBUG accepted command: ${command}`);
		}
		return response;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		appendOutput(`[error] ${message}`, true);
		vscode.window.showErrorMessage(`MUMPS debug command failed: ${message}`);
		return undefined;
	}
}

export async function zstep(): Promise<void> { await sendDebugCommand('ZSTEP', 'Step'); }
export async function zcontinue(): Promise<void> { await sendDebugCommand('ZCONTINUE', 'Continue'); }
export async function zwrite(): Promise<void> { await sendDebugCommand('ZWRITE', 'Inspect variables'); }
export async function zshow(): Promise<void> { await sendDebugCommand('ZSHOW', 'Show stack/environment'); }

export async function zbreak(): Promise<void> {
	const target = (await pickZbreakTarget())?.trim();
	if (!target) {
		return;
	}
	if (!isLikelyEntryReference(target)) {
		const confirmation = await vscode.window.showWarningMessage(
			`'${target}' does not look like TAG+OFFSET^ROUTINE. Send it anyway?`,
			{ modal: false },
			'Send Anyway'
		);
		if (confirmation !== 'Send Anyway') {
			return;
		}
	}
	rememberZbreakTarget(target);
	await sendDebugCommand(`ZBREAK ${target}`, 'Set breakpoint');
}

export async function zprintAtPos(): Promise<void> {
	await sendDebugCommand('ZPRINT @$ZPOSITION', 'Print current line');
}

export async function zprint(): Promise<void> {
	const target = await vscode.window.showInputBox({
		prompt: 'ZPRINT target. Leave the default to print the current $ZPOSITION.',
		value: '@$ZPOSITION',
		placeHolder: '@$ZPOSITION or TAG+OFFSET^ROUTINE'
	});
	if (!target) {
		return;
	}
	await sendDebugCommand(`ZPRINT ${target.trim()}`, 'Print code');
}

export async function zstepInto(): Promise<void> {
	await sendDebugCommand('ZSTEP INTO', 'Step into');
}

export async function zstepOutOf(): Promise<void> {
	await sendDebugCommand('ZSTEP OUTOF', 'Step out');
}

export async function configureZstepLinePrinting(): Promise<void> {
	await sendDebugCommand('SET $ZSTEP="ZPRINT @$ZPOSITION BREAK"', 'Configure $ZSTEP line printing');
}

export async function showZposition(): Promise<void> {
	await sendDebugCommand('WRITE $ZPOSITION', 'Show $ZPOSITION');
}

export async function sendRawDebugCommand(): Promise<void> {
	const command = await vscode.window.showInputBox({ prompt: 'MUMPS/GT.M debug command (for example: ZWRITE, ZSHOW, ZPRINT @$ZPOSITION)' });
	if (!command) {
		return;
	}
	await sendDebugCommand(command, 'Raw command');
}

export function registerDirectDebugControls(context: vscode.ExtensionContext): void {
	const statusItems = directDebugControls.map((control) => {
		const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, control.priority);
		item.text = control.text;
		item.tooltip = control.tooltip;
		item.command = control.command;
		if (control.isPosition) {
			positionStatusItem = item;
		}
		context.subscriptions.push(item);
		return item;
	});
	const updateVisibility = () => {
		const isMumpsDebugSession = vscode.debug.activeDebugSession?.type === 'mumps';
		for (const item of statusItems) {
			if (isMumpsDebugSession) {
				item.show();
			} else {
				item.hide();
			}
		}
	};
	context.subscriptions.push(
		vscode.debug.onDidStartDebugSession(updateVisibility),
		vscode.debug.onDidTerminateDebugSession(updateVisibility),
		vscode.debug.onDidChangeActiveDebugSession(updateVisibility)
	);
	updateVisibility();
}


export function updateDirectDebugPosition(position: string): void {
	if (!positionStatusItem) {
		return;
	}
	positionStatusItem.text = `$(location) ${position || '$ZPOS'}`;
	positionStatusItem.tooltip = position ? `MUMPS current $ZPOSITION: ${position}` : 'MUMPS: Show $ZPOSITION';
}
