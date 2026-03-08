import { logUserInfo } from "../api/api";

export async function createLog(
    userAgent,
    isIOS,
    isStandalone,
    isMobile,
    log,
    extra = {}
) {
    let device = isIOS ? "iOS" : "Android";
    let pwaInstalled = isStandalone ? true : false;
    try {
        const logInfo = {
            log: log,
            pwa_installed: pwaInstalled,
            browser: userAgent,
            device: isMobile ? device : "PC",
            extra: extra,
        };

        const response = await logUserInfo(logInfo);
    } catch (error) {
        console.log(error);
    }
}
