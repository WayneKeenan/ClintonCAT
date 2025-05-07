import DOMMessenger from '@/common/helpers/dom-messenger';

DOMMessenger.registerMessageListener();

const pageInfoPayload = {
    domain: window.location.hostname,
    url: window.location.href,
};

void chrome.runtime.sendMessage({
    type: 'pageInfo',
    payload: pageInfoPayload,
});
