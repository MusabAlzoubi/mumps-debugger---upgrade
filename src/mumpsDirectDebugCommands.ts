import * as vscode from 'vscode';

async function sendDebugCommand(command: string): Promise<void> {
	const session = vscode.debug.activeDebugSession;
	if (!session || session.type !== 'mumps') {
		vscode.window.showWarningMessage('No active MUMPS debug session.');
		return;
	}
	await session.customRequest('mumps.rawCommand', { command });
}

export async function zstep(): Promise<void> { await sendDebugCommand('ZSTEP'); }
export async function zcontinue(): Promise<void> { await sendDebugCommand('ZCONTINUE'); }
export async function zwrite(): Promise<void> { await sendDebugCommand('ZWRITE'); }
export async function zshow(): Promise<void> { await sendDebugCommand('ZSHOW'); }

export async function zbreak(): Promise<void> {
	const target = await vscode.window.showInputBox({ prompt: "ZBREAK target (e.g. TEST+3^KJOTEST)" });
	if (!target) {
		return;
	}
	await sendDebugCommand(`ZBREAK ${target}`);
}

export async function zprintAtPos(): Promise<void> {
	await sendDebugCommand('ZPRINT @$ZPOSITION');
}


export async function zstepInto(): Promise<void> {
	await sendDebugCommand('ZSTEP INTO');
}

export async function zstepOutOf(): Promise<void> {
	await sendDebugCommand('ZSTEP OUTOF');
}


export async function sendRawDebugCommand(): Promise<void> {
	const command = await vscode.window.showInputBox({ prompt: 'MUMPS/GT.M debug command (for example: ZWRITE, ZSHOW, ZPRINT @$ZPOSITION)' });
	if (!command) {
		return;
	}
	await sendDebugCommand(command);
}
