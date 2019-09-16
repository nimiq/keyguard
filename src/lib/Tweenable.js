class Tweenable {
    /**
     * @param {number} [targetValue=0]
     * @param {number} [startValue=targetValue]
     * @param {number} [tweenTime=0]
     * @param {number} [startTime=Date.now()]
     * @param {(function(number): number)} [easing=Tweenable.Easing.EASE_IN_OUT_CUBIC]
     */
    constructor(
        targetValue = 0,
        startValue = targetValue,
        tweenTime = 0,
        startTime = Date.now(),
        easing = Tweenable.Easing.EASE_IN_OUT_CUBIC,
    ) {
        /** @type {number} */
        this.targetValue = targetValue;
        /** @type {number} */
        this.startValue = startValue;
        /** @type {number} */
        this.tweenTime = tweenTime;
        /** @type {number} */
        this.startTime = startTime;
        /** @type {{(t: number): number}} */
        this.easing = easing;
    }

    /** @type {number} */
    get currentValue() {
        const easedProgress = this.easing(this.progress);
        return this.startValue + (this.targetValue - this.startValue) * easedProgress;
    }

    /** @type {number} */
    get progress() {
        if (this.tweenTime === 0) {
            return 1;
        }
        return Math.min(1, (Date.now() - this.startTime) / this.tweenTime);
    }

    /** @type {boolean} */
    get finished() {
        return this.progress === 1;
    }

    /**
     * @param {number} targetValue
     * @param {number} [tweenTime]
     */
    tweenTo(targetValue, tweenTime = this.tweenTime) {
        if (targetValue === this.targetValue) {
            return;
        }
        this.startValue = this.currentValue;
        this.targetValue = targetValue;
        this.startTime = Date.now();
        this.tweenTime = tweenTime;
    }
}

// see https://gist.github.com/gre/1650294 for more easing functions
/* eslint-disable arrow-parens */
Tweenable.Easing = {
    LINEAR: (/** @type number */ t) => t,
    EASE_IN_OUT_CUBIC: (/** @type number */ t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
};
/* eslint-enable arrow-parens */
