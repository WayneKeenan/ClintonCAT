import getChromeLastError from '@/utils/helpers/get-chrome-last-error';
import { RuntimeMessage, MessageRequest, MessageResponse, MessageMap } from './messages.types';

function sendMessage<K extends keyof MessageMap>(type: K, payload: MessageRequest<K>): Promise<MessageResponse<K>> {
    return new Promise((resolve, reject) => {
        const message: RuntimeMessage<K> = { type, payload };

        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) return reject(getChromeLastError());

            resolve(response as MessageResponse<K>);
        });
    });
}

export default sendMessage;
