import { Manager } from './Kernel';


class ProcessManager extends Manager {
    name = 'processes';

    getModuleApi() {
        return {};
    };
}

export default ProcessManager;