import { RuntimeMessage, MessageRequest, MessageResponse, MessageMap } from './messages.types';
import browser from 'webextension-polyfill';

async function sendMessage<K extends keyof MessageMap>(
    type: K,
    payload: MessageRequest<K>
): Promise<MessageResponse<K>> {
    const message: RuntimeMessage<K> = { type, payload };

    try {
        const response = await browser.runtime.sendMessage(message);

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
            throw new Error(String((response as { error: unknown }).error));
        }

        return await Promise.resolve(response as MessageResponse<K>);
    } catch (error) {
        if (error instanceof Error) {
            const errorMessage = error.message;
            const isPortClosedError = /message port closed|receiving end does not exist/i.test(errorMessage);

            if (isPortClosedError) {
                console.warn(`sendMessage: Ignoring "${errorMessage}" because it's likely a timing issue.`);
                return {} as MessageResponse<K>;
            } else {
                console.error(`sendMessage: rejecting due to error: "${errorMessage}"`);
                throw error;
            }
        }
        throw error;
    }
}

export default sendMessage;
