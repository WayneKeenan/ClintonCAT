import Preferences from '@/common/services/preferences';

import { Page } from '@/models/page';

export interface INotificationsFilter {
    timestamp: number;
    pageId: number;
    revision: number;
}

class NotificationsFilter {
    static readonly NOTIFICATIONS_FILTER_KEY = 'notifications_filter';

    public static async get(): Promise<Record<string, INotificationsFilter>> {
        let result: Record<string, INotificationsFilter> = {};
        const data = await Preferences.getStorage(NotificationsFilter.NOTIFICATIONS_FILTER_KEY);
        if (data) {
            result = data as Record<string, INotificationsFilter>;
        }
        return result;
    }

    public static update(page: INotificationsFilter) {
        Promise.all([NotificationsFilter.get()])
            .then(([pages]) => {
                pages[page.pageId] = page;
                Preferences.setStorage(NotificationsFilter.NOTIFICATIONS_FILTER_KEY, pages);
            })
            .catch((error: unknown) => console.error('Failed to get notifications filter:', error));
    }

    public static filterPages(pages: readonly Page[], filters: Record<string, INotificationsFilter>, muteTime: number) {
        const now = Date.now();
        return pages.filter((entry) => {
            const existingPage = filters[entry.pageId];

            if (!existingPage) return true;

            // TODO: revision based finter curently just permanent using page id.
            if (existingPage.revision == entry.pageId) {
                return false;
            }

            return existingPage.timestamp + muteTime < now;
        });
    }
}

export default NotificationsFilter;
