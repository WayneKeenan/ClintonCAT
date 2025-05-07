import { RuntimeMessage, MessageRequest, MessageResponse, MessageMap } from './messages.types';

function sendMessage<K extends keyof MessageMap>(type: K, payload: MessageRequest<K>): Promise<MessageResponse<K>> {
    return new Promise((resolve, reject) => {
        const message: RuntimeMessage<K> = { type, payload };

        chrome.runtime.sendMessage(message, (response: unknown) => {
            if (chrome.runtime.lastError) {
                const errorMessage = chrome.runtime.lastError.message ?? 'Unknown messaging error';

                const isPortClosedError = /message port closed|receiving end does not exist/i.test(errorMessage);

                if (isPortClosedError) {
                    if (
                        response &&
                        typeof response === 'object' &&
                        Object.prototype.hasOwnProperty.call(response, 'error') &&
                        (response as { error: unknown }).error
                    ) {
                        console.warn(
                            'sendMessage: Port closed/Receiver missing AND received explicit error from background handler:',
                            (response as { error: unknown }).error
                        );
                        return reject(new Error(String((response as { error: unknown }).error)));
                    } else {
                        console.warn(
                            `sendMessage: Ignoring "${errorMessage}" because handler reported no error (likely a timing issue).`
                        );
                        return resolve(response as MessageResponse<K>);
                    }
                } else {
                    console.error(`sendMessage: rejecting due to other chrome.runtime.lastError: "${errorMessage}"`);
                    return reject(new Error(errorMessage));
                }
            }

            if (
                response &&
                typeof response === 'object' &&
                Object.prototype.hasOwnProperty.call(response, 'error') &&
                (response as { error: unknown }).error
            ) {
                console.warn(
                    'sendMessage: Received explicit error from background handler:',
                    (response as { error: unknown }).error
                );
                return reject(new Error(String((response as { error: unknown }).error)));
            }
            resolve(response as MessageResponse<K>);
        });
    });
}

export default sendMessage;
