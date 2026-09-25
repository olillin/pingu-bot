/**
 * Reattempt an action until success or a maximum amount of times.
 * @param action The action to perform. The attempt number is given as a parameter, starting at 0. If the action returns false it is considered failed.
 * @param maxAttempts How many attempts to allow failure before exiting.
 * @param initialInterval How long to wait in seconds before retrying if the first action fails.
 * @param intervalRate A factor much to multiply the interval by after each failed attempt.
 * @returns The return value from the action that succeeded, or false if the action did not succeed.
 * @throws If maxAttepmts is less than 1.
 */
export async function reattemptAsync<T>(
    action: (attemptNumber: number) => Promise<T | false>,
    maxAttempts: number = 3,
    initialInterval: number = 3,
    intervalRate: number = 2
): Promise<T | false> {
    if (maxAttempts < 1) {
        throw new Error('Max attempts can not be less than 1')
    }

    let attemptCount = 0
    let interval = initialInterval

    while (attemptCount < maxAttempts) {
        const value = await action(attemptCount)
        if (value !== false) {
            return value
        }

        attemptCount++
        if (attemptCount >= maxAttempts) {
            break
        }
        await sleep(interval)
        interval *= intervalRate
    }

    return false
}

/**
 * Wait for a period of time.
 * @param seconds How long to sleep in seconds.
 * @returns A promise which resolves after the specified time.
 */
export function sleep(seconds: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, seconds * 1000)
    })
}
