/* global I18n */
/* global TemplateTags */
/* global Observable */

/**
 * @abstract
 * @template {string} Step - a supported step's type, e.g. 'step1' | 'step2' | ...
 * @template {keyof HTMLElementTagNameMap} [ContainerTagName='div']
 * @template {keyof HTMLElementTagNameMap} [MessageBubbleTagName='div']
 * @template {keyof HTMLElementTagNameMap} [CodeTagName='code']
 */
class BackupCodesIllustrationBase extends Observable { // eslint-disable-line no-unused-vars
    /**
     * @param {Record<string, Step>} Steps
     * @param {Step} step
     * @param {?{
     *     container?: ContainerTagName,
     *     messageBubble?: MessageBubbleTagName,
     *     code?: CodeTagName,
     * }} [tagNames]
     * @param {?HTMLElementTagNameMap[ContainerTagName]} [$el]
     */
    constructor(Steps, step, tagNames, $el) {
        super();
        this._Steps = Steps;
        this.$el = BackupCodesIllustrationBase._createElement($el, tagNames);
        this._messageBubbles = /** @type {Array<HTMLElementTagNameMap[MessageBubbleTagName]> & { length: 2 }} */ (
            Array.from(this.$el.querySelectorAll('.message-bubble')));
        this._codes = /** @type {Array<HTMLElementTagNameMap[CodeTagName]> & { length: 2 }} */ (
            Array.from(this.$el.querySelectorAll('.code')));
        this.step = this._step = step; // eslint-disable-line no-multi-assign
    }

    /**
     * @template {keyof HTMLElementTagNameMap} [ContainerTagName='div']
     * @param {?HTMLElementTagNameMap[ContainerTagName]} [$el]
     * @param {?{
     *     container?: keyof HTMLElementTagNameMap,
     *     messageBubble?: keyof HTMLElementTagNameMap,
     *     code?: keyof HTMLElementTagNameMap
     * }} [tagNames]
     * @returns {HTMLElementTagNameMap[ContainerTagName]}
     */
    static _createElement($el, tagNames) {
        const containerTagName = tagNames && tagNames.container ? tagNames.container : 'div';
        const messageBubbleTagName = tagNames && tagNames.messageBubble ? tagNames.messageBubble : 'div';
        const codeTagName = tagNames && tagNames.code ? tagNames.code : 'code';

        $el = $el || /** @type {HTMLElementTagNameMap[ContainerTagName]} */ (document.createElement(containerTagName));
        $el.classList.add('backup-codes-illustration-base');

        $el.innerHTML = TemplateTags.hasVars(8)`
            <${messageBubbleTagName} class="message-bubble code-1">
                <div class="background"></div>
                <div class="label" data-i18n="backup-codes-illustration-label">Nimiq Backup Code {n}/2</div>
                <${codeTagName} class="code"></${codeTagName}>
            </${messageBubbleTagName}>
            <${messageBubbleTagName} class="message-bubble code-2">
                <div class="background"></div>
                <div class="label" data-i18n="backup-codes-illustration-label">Nimiq Backup Code {n}/2</div>
                <${codeTagName} class="code"></${codeTagName}>
            </${messageBubbleTagName}>
        `;

        $el.querySelectorAll('.label').forEach((label, index) => I18n.translateToHtmlContent(
            /** @type {HTMLElement} */ (label),
            'backup-codes-illustration-label',
            { n: (index + 1).toString() },
        ));

        return $el;
    }

    /**
     * @type {Step}
     */
    get step() {
        return this._step;
    }

    /**
     * @param {Step} step
     */
    set step(step) {
        this._step = step;
        for (const s of Object.values(this._Steps)) {
            this.$el.classList.toggle(s, s === step);
        }
        for (const messageBubble of this._messageBubbles) {
            const classes = this._getMessageBubbleClasses(messageBubble, step);
            messageBubble.classList.toggle('masked', classes.masked);
            messageBubble.classList.toggle('faded', classes.faded);
            messageBubble.classList.toggle('zoomed', classes.zoomed);
            messageBubble.classList.toggle('complete', classes.complete);
        }
    }

    /**
     * @param {boolean} isLoading
     */
    set loading(isLoading) {
        for (const messageBubble of this._messageBubbles) {
            messageBubble.classList.toggle('loading', isLoading);
        }
    }

    /**
     * @param {string} code
     */
    set code1(code) {
        this._setCode(1, code);
    }

    /**
     * @param {string} code
     */
    set code2(code) {
        this._setCode(2, code);
    }

    /**
     * @protected
     * @param {1 | 2} codeIndex
     * @param {string} code
     */
    _setCode(codeIndex, code) {
        this._codes[codeIndex - 1].textContent = code;
    }

    /**
     * @abstract
     * @protected
     * @param {HTMLElementTagNameMap[MessageBubbleTagName]} messageBubble
     * @param {Step} step
     * @returns {Record<'masked' | 'faded' | 'zoomed' | 'complete', boolean>}
     */
    _getMessageBubbleClasses(messageBubble, step) { // eslint-disable-line no-unused-vars
        throw new Error('Abstract method _getMessageBubbleClasses');
    }

    /**
     * @protected
     * @template {string} Step
     * @param {ViewTransition} viewTransition
     * @param {Step} oldStep
     * @param {Step} newStep
     * @param {HTMLElement} $viewport
     * @param {Record<Step, 1 | 2>} topMessageBubbleForStep
     * @returns {Promise<void>}
     */
    static async _customizeViewTransition(viewTransition, oldStep, newStep, $viewport, topMessageBubbleForStep) {
        const TRANSITION_DURATION_LONG = 500;
        const TRANSITION_DURATION_SHORT = 300;

        const oldTopMessageBubble = topMessageBubbleForStep[oldStep];
        const newTopMessageBubble = topMessageBubbleForStep[newStep];
        const isSwitchingMessageBubbles = oldTopMessageBubble !== newTopMessageBubble;
        const transitionDuration = isSwitchingMessageBubbles ? TRANSITION_DURATION_LONG : TRANSITION_DURATION_SHORT;
        const transitionOptions = Object.freeze({
            duration: transitionDuration,
            fill: 'both',
        });

        document.documentElement.style.setProperty(
            '--backup-codes-view-transition-duration',
            `${transitionDuration}ms`,
        );

        if (newStep === oldStep) return; // no further customization needed; just go with the browser default

        await viewTransition.ready;
        const viewport = $viewport.getBoundingClientRect();
        /** @type {Animation[]} */
        const animations = [];
        for (let codeIndex = 1; codeIndex <= 2; codeIndex++) {
            const transitionName = `backup-codes-illustration-base-code-${codeIndex}`;

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
                    /(?<=matrix\((?:[^,]+,){4}|matrix3d\((?:[^,]+,){12}|translateX?\()([^,]+)/,
                    /(?<=matrix\((?:[^,]+,){5}|matrix3d\((?:[^,]+,){13}|translate\([^,]+,|translateY\()([^,]+)/,
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
            animations.push(document.documentElement.animate([{
                ...transitionGroupConstantStyles,
                zIndex: codeIndex === oldTopMessageBubble ? 1 : 0,
            }, {
                ...transitionGroupConstantStyles,
                zIndex: codeIndex === newTopMessageBubble ? 1 : 0,
            }], {
                ...transitionOptions,
                pseudoElement: transitionGroup,
            }));

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
            if (oldTopMessageBubble === newTopMessageBubble) {
                // No switch of which message bubble is on top.
                animations.push(document.documentElement.animate(
                    [transitionImagePairKeyframeStart, transitionImagePairKeyframeEnd],
                    {
                        ...transitionOptions,
                        pseudoElement: transitionImagePair,
                    },
                ));
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
                animations.push(document.documentElement.animate(
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
                ));

                for (const image of ['old', 'new']) {
                    const opacityStart = image === 'old' ? 1 : 0;
                    const opacityEnd = 1 - opacityStart;
                    // When message bubbles are next to each other (i.e. in the mid state), they should both display
                    // their non-zoomed (if the zoom changes) or non-grayed-out (zoomed non-background) content.
                    const isZooming = scaleXStart !== scaleXEnd;
                    const isZoomingIn = scaleXStart < scaleXEnd;
                    const isStartingInForeground = codeIndex === oldTopMessageBubble;
                    const opacityMid = (isZooming ? isZoomingIn : isStartingInForeground) ? opacityStart : opacityEnd;
                    animations.push(document.documentElement.animate(
                        {
                            opacity: [opacityStart, opacityMid, opacityMid, opacityEnd],
                        }, {
                            ...transitionOptions,
                            pseudoElement: `::view-transition-${image}(${transitionName})`,
                        },
                    ));
                }
            }
        }

        // Clear all applied animations manually after transition end (without awaiting it), because Firefox doesn't do
        // it properly itself.
        viewTransition.finished.finally(() => {
            for (const animation of animations) {
                animation.cancel();
            }
        });
    }
}
