export type StorageOptions = {
	name: string;
	dir: string;
};
declare class Storage$1 {
	#private;
	constructor(options: StorageOptions);
	open(): Promise<string[]>;
	close(): Promise<void>;
	write(x: string): Promise<void>;
	append(x: string): Promise<void>;
	flush(): Promise<void>;
}

export {
	Storage$1 as default,
};

export {};
