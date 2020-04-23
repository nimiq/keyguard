/* global Nimiq */
/* global I18n */
/* global Errors */
/* global TemplateTags */

/** @typedef {{
 *      length: number,
 *      lengthWithLineCaps: number,
 *      gap: number,
 *      offset: number,
 *      strokeWidth: number
 *  }} CircleInfo */

class Timer extends Nimiq.Observable {
    /**
     * @param {number} startTime
     * @param {number} endTime
     * @param {HTMLElement} [$el]
     */
    constructor(startTime, endTime, $el) {
        super();

        this.$el = Timer._createElement($el);
        /** @private
         *  @type {SVGCircleElement} */
        this.$timeCircle = (this.$el.querySelector('.time-circle'));
        /** @private
         *  @type {SVGCircleElement} */
        this.$fillerCircle = (this.$el.querySelector('.filler-circle'));
        /** @private
         *  @type {SVGTextElement} */
        this.$countdown = (this.$el.querySelector('.countdown'));
        /** @private
         *  @type {HTMLDivElement} */
        this.$tooltipCountdown = (this.$el.querySelector('.tooltip-countdown'));

        /** @private
         *  @type {number} */
        this._startTime = startTime;
        /** @private
         *  @type {number} */
        this._endTime = endTime;

        /** @private
         *  @type {number} */
        this._lastUpdateTime = 0;
        /** @private
         *  @type {number | null} */
        this._requestAnimationFrameId = null;

        window.setTimeout(() => this.fire(Timer.Events.END, endTime), endTime - Date.now());
        this._rerender();
    }

    /**
     * @private
     * @param {HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('timer', 'tooltip');
        $el.tabIndex = 0; // make it focusable

        $el.innerHTML = TemplateTags.noVars`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26">
                <circle class="time-circle" cx="50%" cy="50%" r="12"
                        stroke-width="2"></circle>
                <circle class="filler-circle" cx="50%" cy="50%" r="12"
                        stroke-width="0"></circle>

                <text class="countdown" x="50%" y="50%">0</text>
            </svg>
            <div class="tooltip-box">
                <span data-i18n="timer-expiry">This offer expires in</span>
                <span class="tooltip-countdown"></span>.
            </div>
        `;

        return $el;
    }

    /**
     * @private
     * @returns {number}
     */
    get _totalTime() {
        return Math.max(0, this._endTime - this._startTime);
    }

    /**
     * @private
     * @returns {number}
     */
    get _timeLeft() {
        return Math.max(0, Math.min(this._totalTime, this._endTime - Date.now()));
    }

    /**
     * @private
     * @returns {number}
     */
    get _progress() {
        return 1 - this._timeLeft / this._totalTime;
    }

    /**
     * @private
     * @returns {number}
     */
    get _updateInterval() {
        const timerSize = this.$el.offsetWidth || Timer.VIEWBOX_SIZE;
        const scaleFactor = timerSize / Timer.VIEWBOX_SIZE;
        const circleLengthPixels = Timer.FULL_CIRCLE_LENGTH * scaleFactor;
        const steps = circleLengthPixels * 3; // update every .33 pixel change for smooth transitions
        const minInterval = 1000 / 60; // up to 60 fps
        const maxInterval = this._timeLeft < 60000
            ? 500 // when counting down seconds update more regularly
            : Number.POSITIVE_INFINITY;
        return Math.max(minInterval, Math.min(maxInterval, this._totalTime / steps));
    }

    /**
     * @private
     * @returns {CircleInfo}
     */
    _calculateTimeCircleInfo() {
        // Have a max length to make it more recognizable that this is a timer by never rendering a full circle.
        // The rounded stroke ending rendered with radius strokeWidth/2 does not count towards the stroke length,
        // therefore to get the desired gap of 1.5 strokeWidths, we use 2.5 strokeWidths.
        const maxLength = Timer.FULL_CIRCLE_LENGTH - 2.5 * Timer.STROKE_WIDTH;
        const length = Math.min(maxLength, (1 - this._progress) * Timer.FULL_CIRCLE_LENGTH);
        const lengthWithLineCaps = length + Timer.STROKE_WIDTH; // add line caps with strokeWidth/2 radius
        const gap = Timer.FULL_CIRCLE_LENGTH - length;
        // The path grows clockwise starting on the right side. Offset by 90 degrees and gap to let path start with gap
        // and end on top.
        const offset = Timer.FULL_CIRCLE_LENGTH / 4 - gap;
        return {
            length,
            lengthWithLineCaps,
            gap,
            offset,
            strokeWidth: Timer.STROKE_WIDTH,
        };
    }

    /**
     * @private
     * @param {CircleInfo} timeCircleInfo
     * @returns {CircleInfo}
     */
    _calculateFillerCircleInfo(timeCircleInfo) {
        // Filler circle should be rendered in the gap left by the time circle with a margin of strokeWidth. If there
        // is not enough space, compensate by reducing the filler circle stroke width.
        const availableSpace = Timer.FULL_CIRCLE_LENGTH - timeCircleInfo.lengthWithLineCaps - 2 * Timer.STROKE_WIDTH;
        const lengthWithLineCaps = Math.max(0, availableSpace);
        const strokeWidth = Math.min(Timer.STROKE_WIDTH, lengthWithLineCaps);
        const length = Math.max(0, lengthWithLineCaps - strokeWidth); // subtract rounded line caps
        const gap = Timer.FULL_CIRCLE_LENGTH - length;
        const offset = Timer.FULL_CIRCLE_LENGTH / 4 // rotate by 90 degrees
            - Timer.STROKE_WIDTH / 2 // skip rounded line cap of time circle
            - Timer.STROKE_WIDTH // margin
            - strokeWidth / 2; // account for our own line cap
        return {
            length,
            lengthWithLineCaps,
            gap,
            offset,
            strokeWidth,
        };
    }

    /** @private */
    _rerender() {
        if (this._requestAnimationFrameId !== null) return;
        this._requestAnimationFrameId = requestAnimationFrame(() => {
            // update if necessary
            if (Date.now() - this._lastUpdateTime >= this._updateInterval) {
                this._lastUpdateTime = Date.now();

                const timeCircleInfo = this._calculateTimeCircleInfo();
                this.$timeCircle.style.strokeDasharray = `${timeCircleInfo.length} ${timeCircleInfo.gap}`;
                this.$timeCircle.style.strokeDashoffset = timeCircleInfo.offset.toString();

                const fillerCircleInfo = this._calculateFillerCircleInfo(timeCircleInfo);
                this.$fillerCircle.style.strokeDasharray = `${fillerCircleInfo.length} ${fillerCircleInfo.gap}`;
                this.$fillerCircle.style.strokeDashoffset = fillerCircleInfo.offset.toString();
                this.$fillerCircle.style.strokeWidth = fillerCircleInfo.strokeWidth.toString();

                this.$el.classList.toggle('little-time-left', this._progress >= 0.75);

                this.$countdown.textContent = this._toSimplifiedTime(false);
                this.$tooltipCountdown.textContent = this._toSimplifiedTime(true);
            }

            this._requestAnimationFrameId = null;
            if (this._timeLeft === 0) return;
            this._rerender();
        });
    }

    /**
     * @private
     * @param {boolean} [includeUnit=true]
     * @returns {string}
     */
    _toSimplifiedTime(includeUnit = true) {
        // find appropriate unit, starting with second
        let resultTime = this._timeLeft / 1000;
        let resultUnit = 'second';
        const timeSteps = [
            { unit: 'minute', factor: 60 },
            { unit: 'hour', factor: 60 },
            { unit: 'day', factor: 24 },
        ];
        for (const { unit, factor } of timeSteps) { // eslint-disable-line no-restricted-syntax
            if (resultTime / factor < 1) {
                break;
            } else {
                resultTime /= factor;
                resultUnit = unit;
            }
        }

        resultTime = Math.round(resultTime);
        if (!includeUnit) {
            return resultTime.toString();
        }

        resultUnit = `${resultUnit}${resultTime !== 1 ? 's' : ''}`;
        let translatedUnit;
        // Specifically listing all possible i18n translations to enable the translationValidator to find and verify
        // them with its regular expression.
        switch (resultUnit) {
            case 'second': translatedUnit = I18n.translatePhrase('timer-second'); break;
            case 'seconds': translatedUnit = I18n.translatePhrase('timer-seconds'); break;
            case 'minute': translatedUnit = I18n.translatePhrase('timer-minute'); break;
            case 'minutes': translatedUnit = I18n.translatePhrase('timer-minutes'); break;
            case 'hour': translatedUnit = I18n.translatePhrase('timer-hour'); break;
            case 'hours': translatedUnit = I18n.translatePhrase('timer-hours'); break;
            case 'day': translatedUnit = I18n.translatePhrase('timer-day'); break;
            case 'days': translatedUnit = I18n.translatePhrase('timer-days'); break;
            default: throw new Errors.KeyguardError(`Unexpected: Unknown time unit ${resultUnit}`);
        }

        return `${resultTime} ${translatedUnit}`;
    }
}

Timer.Events = {
    END: 'end',
};
// These values are the same as in the svg.
Timer.STROKE_WIDTH = 2;
Timer.VIEWBOX_SIZE = 26;
Timer.RADIUS = 12; // This component is a simplified version of Timer in vue-components with always expanded radius
Timer.FULL_CIRCLE_LENGTH = 2 * Math.PI * Timer.RADIUS;
