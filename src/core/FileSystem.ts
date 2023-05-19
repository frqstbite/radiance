import { v1 } from 'uuid';


//type EntryType = 'file' | 'directory' | 'shortcut';
type EntryId = string;
type NodeId = string;


/**
 * @template {Node<any>} T
 * `Entry` objects represent a `Node`'s data in the `FileSystem`.
 * Each `Entry` is tied to one `Node`, but any `Node` may be tied to several `Entry`s.
 */
class Entry<T extends Node<any>> {
    filesystem: FileSystem;
    id: EntryId;
    name: string;
    node: T;
    parent?: Directory;

    constructor(filesystem: FileSystem, name: string, node: T, parent?: Directory) {
        this.filesystem = filesystem;
        this.id = v1();
        this.name = name;
        this.node = node;
        this.parent = parent;
    }
}


/**
 * @template T
 * Base class for data nodes in the file system.
 */
abstract class Node<T> {
    filesystem: FileSystem;
    id: NodeId;
    references: number = 0;
    data: T;
    
    constructor(filesystem: FileSystem, data: T) {
        this.filesystem = filesystem;
        this.id = v1();
        this.data = data;

        // Register with filesystem
        filesystem.addNode(this);
    }

    /** 
     * Destroy this `Node`.
     */
    remove(): void {
        this.filesystem.removeNode(this.id);
    }

    /** 
     * Executed when an `Entry` representing this `Node` is registered to the `FileSystem`.
     *
     * @param {Entry} entry - The newly registered `Entry`.
     */
    entryAdded(entry: Entry<Node<T>>): void {
        this.references++;
    }

    /** 
     * Executed when an `Entry` representing this `Node` is deregistered from the `FileSystem`.
     *
     * @param {Entry} entry - The formerly registered `Entry`.
     */
    entryRemoved(entry: Entry<Node<T>>): void {
        this.references--;

        // Remove this Node if all Entry references are removed
        if (this.references <= 0) {
            this.remove();
        }
    }
}

/** A `Node` that contains `Entry`s. */
class Directory extends Node<{ [index: string]: Entry<any> }> {
    constructor(filesystem: FileSystem, entries?: Entry<any>[]) {
        super(filesystem, {});

        // Register passed entries
        if (entries) {
            for (const entry of entries) {
                this.addEntry(entry);
            }
        }
    }

    /** 
     * Registers an `Entry` object to being contained within this `Directory`.
     *
     * @param {Entry} entry - The `Entry` to add.
     */
    addEntry(entry: Entry<any>): void {
        if (this.data[entry.name]) {
            throw new Error(`Directory ${this.id} already contains Entry with name ${entry.name}`);
        }

        this.data[entry.name] = entry;
        entry.parent = this;
    }

    /** 
     * Deregisters an `Entry` object from being contained within this `Directory`.
     *
     * @param {string} name - The name of the `Entry` to remove.
     * @return {Entry} - The removed `Entry`, returned for convenience.
     */
    removeEntry(name: string): Entry<any> {
        const entry = this.data[name];

        // Throw if the Entry doesn't exist
        if (!entry) {
            throw new Error(`Invalid attempt to remove Entry with name ${name} from Directory ${this.id}`);
        }
        
        delete this.data[name];
        return entry;
    }
    
    /** 
     * Retrieves an `Entry` contained in this `Directory` with the given name.
     *
     * @param {string} name - The name of the `Entry` to retrieve.
     * @return {Entry?} - The `Entry` with the given name.
     */
    getEntry(name: string): Entry<any> {
        const entry = this.data[name];

        // Throw if the Entry doesn't exist
        if (!entry) {
            throw new Error(`Invalid attempt to retrieve Entry with name ${name} from Directory ${this.id}`);
        }
        
        return entry;
    }

    /** 
     * @returns {Entry[]} - An array of all `Entry`s within this `Directory`.
     */
    getEntries(): Entry<any>[] {
        return Object.values(this.data);
    }
}

/** `ExternDirectory` objects represent a joint between two `FileSystem`s. */
class ExternDirectory extends Directory {
    target: FileSystem;

    constructor(filesystem: FileSystem, target: FileSystem) {
        super(filesystem);
        this.target = target;
        //this.data = target.root.node.data;
    }

    // Reroute to target file system's root directory
    addEntry(entry: Entry<any>): void {
        this.target.root!.node.addEntry(entry);
    }

    removeEntry(name: string): Entry<any> {
        return this.target.root!.node.removeEntry(name);
    }

    getEntry(name: string): Entry<any> {
        return this.target.root!.node.getEntry(name);
    }

    getEntries(): Entry<any>[] {
        return this.target.root!.node.getEntries();
    }
}

/** `File` objects represent ordinary data-containing files in the `FileSystem`. */
class File extends Node<Uint8Array> {
    constructor(filesystem: FileSystem, data: Uint8Array) {
        super(filesystem, data);
    }
}


/** `FileSystem` objects track and hold a single file structure composed of `Node`s and `Entry`s. */
class FileSystem {
    name: string; //String name of the file system; used mostly for debugging purposes
    nodes: { [index: NodeId]: Node<any> }; //All data nodes in the file system
    entries: { [index: EntryId]: Entry<any> }; //All entries in the file system
    root?: Entry<Directory>; //The entry for the root directory of the file system
    
    constructor(name: string) {
        this.name = name;
        this.nodes = {};
        this.entries = {};
    }
    

    /** 
     * Registers a `Node` to this `FileSystem`.
     * 
     * @param {Node} node - The `Node` to add.
     */
    addNode(node: Node<any>): void {
        this.nodes[node.id] = node;
    }

    /**
     * Removes the `Node` with the given id from the `FileSystem`.
     *
     * @param {NodeId} id - Id of the `Node` to remove.
     * @return {Node} - The removed `Node`, returned for convenience.
     */
    removeNode(id: NodeId): Node<any> {
        const node = this.nodes[id];

        // Throw if the Node doesn't exist
        if (!node) {
            throw new Error(`Invalid attempt to remove Node ${id} from FileSystem ${this.name}`);
        }
        
        delete this.nodes[id];
        return node;
    }

    /** 
     * Retrieves a `Node` with the given id.
     *
     * @param {NodeId} id - Id of the `Node` to get.
     * @return {Node} `Node` with the id.
     */
    getNode(id: NodeId): Node<any> {
        const node = this.nodes[id];

        // Throw if the Node doesn't exist
        if (!node) {
            throw new Error(`Invalid attempt to retrieve Node ${id} from FileSystem ${this.name}`);
        }
        
        return node;
    }

    /** 
     * @return {Node[]} All `Node`s in this `FileSystem`.
     */
    getNodes() {
        return Object.values(this.nodes);
    }


    /** 
     * Registers an `Entry` to this `FileSystem`.
     *
     * @param {Entry} entry - The `Entry` to add.
     */
    addEntry(entry: Entry<any>): void {
        this.entries[entry.id] = entry;
        entry.node.entryAdded(entry);
    }

    /** 
     * Removes an `Entry` from this `FileSystem`.
     *
     * @param {EntryId} id - Id of the `Entry` to remove.
     * @return {Entry} - The removed `Entry`. Returned for convenience. 
     */
    removeEntry(id: EntryId): Entry<any> {
        const entry = this.entries[id];

        // Throw if the Entry doesn't exist
        if (!entry) {
            throw new Error(`Invalid attempt to remove Entry ${id} from FileSystem ${this.name}`);
        }

        entry.parent?.removeEntry(entry.name);
        delete this.entries[id];
        entry.node.entryRemoved(entry);
        return entry;
    }

    /** 
     * Retrieves an `Entry` with the given id.
     *
     * @param {EntryId} id - Id of the `Entry` to get.
     * @return {Entry} `Entry` with the id, or undefined if it doesn't exist.
     */
    getEntry(id: EntryId): Entry<any> {
        const entry = this.entries[id];

        // Throw if the Entry doesn't exist
        if (!entry) {
            throw new Error(`Invalid attempt to retrieve Entry ${id} from FileSystem ${this.name}`);
        }
        
        return entry;
    }

    /** 
     * @return {Entry[]} - All `Entry`s in this `FileSystem`.
     */
    getEntries(): Entry<any>[] {
        return Object.values(this.entries);
    }
}


export {
    FileSystem
};