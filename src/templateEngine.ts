export interface RoutineHeaderTemplateArgs {
	routineName: string;
	company: string;
	author: string;
	description: string;
	version: string;
	namespace: string;
	patch: string;
	date: string;
	build: string;
}

export function createRoutineHeaderTemplate(args: RoutineHeaderTemplateArgs): string {
	return `${args.routineName} ;;${args.company}/${args.author} - ${args.description} ;${args.date}\n` +
		` ;;${args.version};${args.namespace};**${args.patch}**;${args.date};Build ${args.build}\n` +
		` ;; Description  : ${args.description}\n` +
		` ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;\n`;
}

export interface PatchChangeBlockTemplateArgs {
	company: string;
	author: string;
	patch: string;
	date: string;
	fixType: string;
	reason: string;
	scope?: string;
}

export function createPatchChangeBlockTemplate(args: PatchChangeBlockTemplateArgs): string {
	const scopeLine = args.scope ? ` ; Scope         : ${args.scope}\n` : '';
	return ` ; ${args.company}/${args.author} ; ${args.patch} ; ${args.date} ; ${args.fixType} [${args.reason}]\n` +
		scopeLine +
		` ; START OF CODE CHANGES FOR ${args.patch}\n` +
		` ; TODO: Comment original VA/VistA code here without changing it.\n` +
		` ; TODO: Add changed code here.\n` +
		` ; END OF CODE CHANGES FOR ${args.patch}\n`;
}
