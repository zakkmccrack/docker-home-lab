
export async function checkAllStatus() {
    try {
        const res = await fetch("/music/api/status");
        return res.status === 200;
    } catch {
        return false;
    }
}
