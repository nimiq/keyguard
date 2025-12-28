/* global I18n */
/* global TemplateTags */
/* global ExportBackupCodes */

/**
 * @typedef {Exclude<ExportBackupCodes.Pages, typeof ExportBackupCodes.Pages.UNLOCK>} BackupCodesIllustrationStep
 */

class BackupCodesIllustration { // eslint-disable-line no-unused-vars
    /**
     * @param {?BackupCodesIllustrationStep} [step]
     * @param {?HTMLDivElement} [$el]
     */
    constructor(step, $el) {
        this.$el = BackupCodesIllustration._createElement($el);
        this._messageBubbles = /** @type {[HTMLDivElement, HTMLDivElement]} */ (
            Array.from(this.$el.querySelectorAll('.message-bubble')));
        this._codes = /** @type {[HTMLDivElement, HTMLDivElement]} */ (
            Array.from(this.$el.querySelectorAll('.code')));
        if (step) {
            this.setStep(step);
        }
    }

    /**
     * @param {?HTMLDivElement} [$el]
     * @returns {HTMLDivElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('backup-codes-illustration');

        $el.innerHTML = TemplateTags.noVars`
            <div class="message-bubble code-1">
                <div class="background"></div>
                <div class="label" data-i18n="backup-codes-illustration-label">Nimiq Backup Code {n}/2</div>
                <code class="code"></code>
            </div>
            <div class="message-bubble code-2">
                <div class="background"></div>
                <div class="label" data-i18n="backup-codes-illustration-label">Nimiq Backup Code {n}/2</div>
                <code class="code"></code>
            </div>
        `;

        $el.querySelectorAll('.label').forEach((label, index) => I18n.translateToHtmlContent(
            /** @type {HTMLElement} */ (label),
            'backup-codes-illustration-label',
            { n: (index + 1).toString() },
        ));

        return $el;
    }

    /**
     * @returns {HTMLDivElement}
     */
    getElement() {
        return this.$el;
    }

    /**
     * @param {BackupCodesIllustrationStep} step
     * @param {HTMLElement} [newParent]
     */
    setStep(step, newParent) {
        for (const s of Object.values(ExportBackupCodes.Pages)) {
            this.$el.classList.toggle(s, s === step);
        }

        const {
            INTRO,
            SEND_CODE_1,
            SEND_CODE_1_CONFIRM,
            SEND_CODE_2,
            SEND_CODE_2_CONFIRM,
            SUCCESS,
        } = ExportBackupCodes.Pages;
        this._messageBubbles.forEach((bubble, index) => {
            bubble.classList.toggle(
                'masked',
                step === INTRO
                    || ([SEND_CODE_1, SEND_CODE_1_CONFIRM].some(s => s === step) && index === 1),
            );
            bubble.classList.toggle(
                'faded',
                ([SEND_CODE_1, SEND_CODE_1_CONFIRM].some(s => s === step) && index === 1)
                    || ([SEND_CODE_2, SEND_CODE_2_CONFIRM].some(s => s === step) && index === 0),
            );
            bubble.classList.toggle(
                'zoomed',
                [SEND_CODE_1, SEND_CODE_1_CONFIRM, SEND_CODE_2, SEND_CODE_2_CONFIRM].some(s => s === step),
            );
            bubble.classList.toggle(
                'complete',
                ([SEND_CODE_1_CONFIRM, SEND_CODE_2].some(s => s === step) && index === 0)
                    || [SEND_CODE_2_CONFIRM, SUCCESS].some(s => s === step),
            );
        });

        if (newParent) {
            newParent.appendChild(this.$el);
        }
    }

    /**
     * @param {boolean} isLoading
     */
    setLoading(isLoading) {
        for (const bubble of this._messageBubbles) {
            bubble.classList.toggle('loading', isLoading);
        }
    }

    /**
     * @param {1 | 2} codeIndex
     * @param {string} code
     */
    setCode(codeIndex, code) {
        this._codes[codeIndex - 1].textContent = code;
    }

    /**
     * @param {ViewTransition} viewTransition
     * @param {BackupCodesIllustrationStep} previousStep
     * @param {BackupCodesIllustrationStep} newStep
     * @param {HTMLElement} $viewport
     * @returns {Promise<void>}
     */
    static async customizeViewTransition(viewTransition, previousStep, newStep, $viewport) {
        const TRANSITION_DURATION_LONG = 500;
        const TRANSITION_DURATION_SHORT = 300;
        const STEP_TOP_MESSAGE_BUBBLE = {
            [ExportBackupCodes.Pages.INTRO]: 2,
            [ExportBackupCodes.Pages.SEND_CODE_1]: 1,
            [ExportBackupCodes.Pages.SEND_CODE_1_CONFIRM]: 1,
            [ExportBackupCodes.Pages.SEND_CODE_2]: 2,
            [ExportBackupCodes.Pages.SEND_CODE_2_CONFIRM]: 2,
            [ExportBackupCodes.Pages.SUCCESS]: 2,
        };

        const previousTopMessageBubble = STEP_TOP_MESSAGE_BUBBLE[previousStep];
        const newTopMessageBubble = STEP_TOP_MESSAGE_BUBBLE[newStep];
        const isSwitchingMessageBubbles = previousTopMessageBubble !== newTopMessageBubble;
        const transitionDuration = isSwitchingMessageBubbles ? TRANSITION_DURATION_LONG : TRANSITION_DURATION_SHORT;
        const transitionOptions = Object.freeze({
            duration: transitionDuration,
            fill: 'both',
        });

        document.documentElement.style.setProperty(
            '--backup-codes-view-transition-duration',
            `${transitionDuration}ms`,
        );

        if (newStep === previousStep) return; // no further customization needed; just go with the browser default

        await viewTransition.ready;
        const viewport = $viewport.getBoundingClientRect();
        for (let codeIndex = 1; codeIndex <= 2; codeIndex++) {
            const transitionName = `backup-codes-illustration-code-${codeIndex}`;

            // Extract transition of size and position from ::view-transition-group.
            const transitionGroup = `::view-transition-group(${transitionName})`;
            const transitionGroupSizeAndPositionAnimation = document.getAnimations().find(
                ({ effect }) => !!effect && 'pseudoElement' in effect && effect.pseudoElement === transitionGroup,
            );
            if (!transitionGroupSizeAndPositionAnimation
                || !(transitionGroupSizeAndPositionAnimation.effect instanceof KeyframeEffect)) continue;
            const sizeAndPositions = transitionGroupSizeAndPositionAnimation.effect.getKeyframes().map(keyframe => {
                const width = Number.parseFloat(String(keyframe.width));
                const height = Number.parseFloat(String(keyframe.height));
                const [translateX, translateY] = [
                    /(?<=matrix\((?:[^,]+,\s*){4}|translateX?\()(\d+(?:.\d+)?)/,
                    /(?<=matrix\((?:[^,]+,\s*){5}|translateY\(|translate\([^,]+,\s*)(\d+(?:.\d+)?)/,
                ].map(regex => {
                    const regexMatch = String(keyframe.transform).match(regex);
                    if (!regexMatch || !regexMatch[1]) return 0;
                    return Number.parseFloat(regexMatch[1]);
                });
                return { width, height, translateX, translateY }; // eslint-disable-line object-curly-newline
            });

            // Setup ::view-transition-group as viewport and hide any overflow. While the properties we're setting are
            // not really animatable and meant to be animated, animate() provides a convenient way for setting them on a
            // pseudo-element and only temporary.
            const transitionGroupConstantStyles = {
                top: `${viewport.top}px`,
                left: `${viewport.left}px`,
                width: `${viewport.width}px`,
                height: `${viewport.height}px`,
                overflow: 'hidden', // hide content outside the viewport
                transform: 'none', // disable default positioning by browser
            };
            transitionGroupSizeAndPositionAnimation.cancel(); // cancel default animation of browser
            document.documentElement.animate([{
                ...transitionGroupConstantStyles,
                zIndex: codeIndex === previousTopMessageBubble ? 1 : 0,
            }, {
                ...transitionGroupConstantStyles,
                zIndex: codeIndex === newTopMessageBubble ? 1 : 0,
            }], {
                ...transitionOptions,
                pseudoElement: transitionGroup,
            });

            // Instead of the default transition of the size and position on ::view-transition-group, we transition them
            // on the ::view-transition-image-pair, also further customizing the transition. Additionally, instead of
            // transitioning the size via with and height, as the default transition, we transition those via transform
            // for improved performance.
            const transitionImagePair = `::view-transition-image-pair(${transitionName})`;
            const transitionImagePairConstantStyles = {
                width: `${sizeAndPositions[0].width}px`,
                height: `${sizeAndPositions[0].height}px`,
                transformOrigin: 'top left',
            };
            const translateXStart = sizeAndPositions[0].translateX - viewport.left;
            const translateYStart = sizeAndPositions[0].translateY - viewport.top;
            const translateXEnd = sizeAndPositions[1].translateX - viewport.left;
            const translateYEnd = sizeAndPositions[1].translateY - viewport.top;
            const scaleXStart = 1;
            const scaleYStart = 1;
            const scaleXEnd = sizeAndPositions[1].width / sizeAndPositions[0].width;
            const scaleYEnd = sizeAndPositions[1].height / sizeAndPositions[0].height;
            const transitionImagePairKeyframeStart = {
                ...transitionImagePairConstantStyles,
                transform: `translate(${translateXStart}px, ${translateYStart}px) `
                    + `scale(${scaleXStart}, ${scaleYStart})`,
            };
            const transitionImagePairKeyframeEnd = {
                ...transitionImagePairConstantStyles,
                transform: `translate(${translateXEnd}px, ${translateYEnd}px) `
                    + `scale(${scaleXEnd}, ${scaleYEnd})`,
            };
            if (previousTopMessageBubble === newTopMessageBubble) {
                // No switch of which message bubble is on top.
                document.documentElement.animate(
                    [transitionImagePairKeyframeStart, transitionImagePairKeyframeEnd],
                    {
                        ...transitionOptions,
                        pseudoElement: transitionImagePair,
                    },
                );
                // In this case, let ::view-transition-old and ::view-transition-new animate with the browser's default
                // transition of fading between the two.
            } else {
                // A switch of which message bubble is on top.
                // The message bubbles should first
                // - move side by side, with code 1 moving up and code 2 moving down along the y-axis, and both message
                //   bubbles being their scaled-up size
                // - pause there
                // - then re-stack at their final size, swapping which one is on top of the stack along the z-axis (by a
                //   shift of z-index of transitionGroup).
                const translateXMid = (translateXStart + translateXEnd) / 2;
                const translateYMid = (translateYStart + translateYEnd) / 2
                    // Code 1 moves up, code 2 moves down; the code that goes on top moves less.
                    + (codeIndex === 1 ? -1 : 1) * (codeIndex === newTopMessageBubble ? 0.25 : 0.40)
                        * Math.max(sizeAndPositions[0].height, sizeAndPositions[1].height);
                const scaleXMid = Math.max(scaleXStart, scaleXEnd);
                const scaleYMid = Math.max(scaleYStart, scaleYEnd);
                const transitionImagePairKeyframeMid = {
                    ...transitionImagePairConstantStyles,
                    transform: `translate(${translateXMid}px, ${translateYMid}px) `
                        + `scale(${scaleXMid}, ${scaleYMid})`,
                };
                document.documentElement.animate(
                    [
                        transitionImagePairKeyframeStart,
                        transitionImagePairKeyframeMid,
                        transitionImagePairKeyframeMid, // pause by specifying the mid keyframe twice
                        transitionImagePairKeyframeEnd,
                    ],
                    {
                        ...transitionOptions,
                        pseudoElement: transitionImagePair,
                    },
                );

                for (const image of ['old', 'new']) {
                    const opacityStart = image === 'old' ? 1 : 0;
                    const opacityEnd = 1 - opacityStart;
                    // When message bubbles are next to each other (i.e. in the mid state), they should both display
                    // their non-zoomed (if the zoom changes) or non-grayed-out (zoomed non-background) content.
                    const isZooming = scaleXStart !== scaleXEnd;
                    const isZoomingIn = scaleXStart < scaleXEnd;
                    const isStartingInForeground = codeIndex === previousTopMessageBubble;
                    const opacityMid = (isZooming ? isZoomingIn : isStartingInForeground) ? opacityStart : opacityEnd;
                    document.documentElement.animate(
                        {
                            opacity: [opacityStart, opacityMid, opacityMid, opacityEnd],
                        }, {
                            ...transitionOptions,
                            pseudoElement: `::view-transition-${image}(${transitionName})`,
                        },
                    );
                }
            }
        }
    }
}
