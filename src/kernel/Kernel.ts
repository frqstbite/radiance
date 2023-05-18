import { FileSystem } from '@/core/FileSystem';


export type Api = { [index: string]: any };

/** Managers are data providers within the kernel with unrestricted access to both kernel and Node APIs. */
abstract class Manager {
    protected kernel?: Kernel;
    public abstract name: string;
    
    /** 
     * Executed when the kernel is instantiating its `Manager`s.
     * Consumption of other `Manager`s is UNSAFE during this phase of initialization.
     *
     * @param {Kernel} kernel - The `Kernel` object this `Manager` belongs to.
     */
    setup(kernel: Kernel): void {
        this.kernel = kernel;
    }

    /**
     * Executed after all `Manager`s have had their `setup` lifecycle hook executed.
     * This `Manager` should be safe for consumption by other `Manager`s at this point.
     */
    start(): void {
        
    }

    /** 
     * Should return an object describing the API exposed by this `Manager` to kernel modules.
     * This API can expose Radiant-sensitive APIs, but NOT host system-sensitive APIs.
     * The user should never have to worry about the security of their host system when installing a kernel module.
     *
     * @return {Api} - This `Manager`'s public module API.
     */
    abstract getModuleApi(): Api;

    /** 
     * Should return an object describing the API exposed by this `Manager` to processes.
     * This API CANNOT expose Radiant-sensitive APIs OR host system-sensitive APIs.
     * Processes
     *
     * @return {Api} - This `Manager`'s public process API.
     */
    //abstract getProcessApi(): Api;
}

/** `Kernel` objects represent a running Radiant kernel and its various services. */
class Kernel {
    public manager: Proxy<Manager>;
    protected managers: { [index: string]: Manager };
    public running: boolean = false;
    
    constructor(managers: Manager[]) {
        // Register passed managers
        this.managers = {};
        
        for (const manager of managers) {
            this.registerManager(manager);
        }
        
        // Create helpful manager proxy
        this.manager = new Proxy({}, {
            get: (target, property, receiver) => {
                return this.getManager(property);
            },
        });
    }

    /** 
     * Register a `Manager` to execute within this `Kernel`.
     * Only available prior to initialization.
     * 
     * @param {Manager} - The `Manager` instance to register.
     */
    registerManager(manager: Manager): void {
        // Only available pre-init
        if (this.running) {
            throw new Error('Kernel.registerManager can only be called prior to Kernel initialization');
        }
        
        // Prevent duplicate names
        if (this.managers[manager.name]) {
            throw new Error(`Manager with name ${manager.name} has already been registered`);
        }
        
        this.managers[manager.name] = manager;
    }

    /** 
     * Retrieve a `Manager` object registered to this `Kernel` by name.
     *
     * @param {string} name - The name of the `Manager`.
     * @return {Manager} - The `Manager` with the given name.
     */
    getManager(name: string): Manager {
        if (!this.managers[name]) {
            throw new Error(`Attempt to access unregistered manager with name ${name}`);
        }

        return this.managers[name];
    }

    /** 
     * Finalize `Manager` registration and begin kernel execution.
     */
    start() {
        // We are officially running - lock down APIs that are only available before initialization 
        this.running = true;

        const managers = Object.values(this.managers)
        
        // Initialize managers
        for (const manager of managers) {
            manager.setup(this);
        }

        // Start managers
        for (const manager of managers) {
            manager.start();
        }
    }
}


export {
    Kernel as default,
    Manager,
};