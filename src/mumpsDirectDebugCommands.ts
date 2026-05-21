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
