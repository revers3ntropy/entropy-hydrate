class Reservoir {
    private data: Record<string, any> = {};

    constructor () {

    }
}

declare global {
    interface Window {
        reservoir: Reservoir;
    }
}

const reservoir = new Reservoir();
window.reservoir = reservoir;
export default reservoir;