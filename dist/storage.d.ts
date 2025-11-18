type StorageOptions = {
    name: string;
    dir: string;
};
declare class Storage {
    private readonly _file;
    private _fd?;
    private _open;
    constructor(options: StorageOptions);
    open(): Promise<string[]>;
    close(): Promise<void>;
    write(x: string): Promise<void>;
    append(x: string): Promise<void>;
    flush(): Promise<void>;
}

export { StorageOptions, Storage as default };
