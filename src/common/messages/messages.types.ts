/**
 * Map of message name -> [RequestPayload, ResponsePayload]
 * ResponsePayload is wrapped in a Promise because handlers can be async.
 *
 * Examples
 *  - 'log': request { title: string, message: string }, response Promise<void>
 *  - 'notify': request { title: string, message: string }, response Promise<void>
 *  - 'page': request { title: string, message: string }, response Promise<void>
 */
export interface MessageMap {
    log: [{ message: string }];
    notify: [{ title: string; message: string }];
    page: [{ title: string; message: string }];
}

// Type helpers to extract request/response from the map:
export type MessageRequest<K extends keyof MessageMap> = MessageMap[K] extends [infer Req, ...unknown[]] ? Req : never;
export type MessageResponse<K extends keyof MessageMap> = MessageMap[K] extends [unknown, infer Res]
    ? Promise<Res>
    : Promise<void>;

/**
 * Runtime message sent from the content script to the background script.
 */
export interface RuntimeMessage<K extends keyof MessageMap> {
    type: K;
    payload: MessageRequest<K>;
}

/**
 * A function that handles a specific message type.
 * It receives the payload of the message and returns a response.
 */
export type MessageHandler<K extends keyof MessageMap> = (payload: MessageRequest<K>) => MessageResponse<K>;
