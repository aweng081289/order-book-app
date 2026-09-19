import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useOrderBookStore = defineStore('orderBook', () => {
    const bids = ref([]);
    const asks = ref([]);

    function updateBids(newBids) {
        bids.value = newBids;
    }

    function updateAsks(newAsks) {
        asks.value = newAsks;
    }

    return { bids, asks, updateBids, updateAsks };
});
