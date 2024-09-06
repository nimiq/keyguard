class ClipboardUtils { // eslint-disable-line no-unused-vars
    /**
     * @param {string} text
     * @returns {boolean}
     */
    static copy(text) {
        // Simplified and typed version of https://github.com/sindresorhus/copy-text-to-clipboard
        // Additionally added a fix for correctly restoring selections in input fields.
        const element = document.createElement('textarea');

        element.value = text;

        // Prevent keyboard from showing on mobile
        element.setAttribute('readonly', '');

        element.style.contain = 'strict';
        element.style.position = 'absolute';
        element.style.left = '-9999px';
        element.style.fontSize = '12pt'; // Prevent zooming on iOS

        // store selection to be restored later
        const selection = /** @type {Selection} */ (document.getSelection());
        const originalRange = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

        const activeInput = document.activeElement
        && (document.activeElement.nodeName === 'INPUT' || document.activeElement.nodeName === 'TEXTAREA')
            ? /** @type {HTMLInputElement | HTMLTextAreaElement} */ (document.activeElement)
            : null;

        document.body.append(element);
        element.select();

        // Explicit selection workaround for iOS
        element.selectionStart = 0;
        element.selectionEnd = text.length;

        let isSuccess = false;
        try {
            isSuccess = document.execCommand('copy');
        } catch (e) {} // eslint-disable-line no-empty

        element.remove();

        if (activeInput) {
            // Inputs retain their selection on blur. We just have to refocus again.
            activeInput.focus();
        } else if (originalRange) {
            selection.removeAllRanges();
            selection.addRange(originalRange);
        }

        return isSuccess;
    }
}
