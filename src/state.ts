export interface SubscriptionInput {
    id: number;
    url: string;
}

export type Proxy = {
    type: string;
    tag: string;
    [key: string]: any;
};

export let subscriptions: SubscriptionInput[] = [
    {
        id: 1,
        url: "",
    },
];

export function addSubscription() {
    subscriptions.push({
        id: Date.now(),
        url: "",
    });
}

export function removeSubscription(id: number) {
    subscriptions = subscriptions.filter((item) => item.id !== id);
}

export function updateSubscription(id: number, url: string) {
    const subscription = subscriptions.find((item) => item.id === id);

    if (subscription) {
        subscription.url = url;
    }
}
