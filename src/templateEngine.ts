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
