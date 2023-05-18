import { Manager } from './Kernel';


class StorageManager extends Manager {
    name = 'storage';

    getModuleApi() {
        return {
            
        };
    };
}

export default StorageManager;