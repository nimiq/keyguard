class TemplateTags {
    // Let typescript infer return value. (Seems to be impossible to declare it the right way in standard JSDoc)
    /**
     * @template {number} T
     * @param {T} variableCount
     *
     */
    static hasVars(variableCount) {
        return (
            /** @type {TemplateStringsArray} */ strings,
            /** @type {(string | number)[] & { length: T }} */ ...expressions
        ) => {
            if (expressions.length !== variableCount) {
                throw new Error('Illegal variable use');
            }

            let output = strings[0];
            expressions.forEach((expression, index) => {
                output += expression + strings[index + 1];
            });

            return output;
        };
    }
}

TemplateTags.noVars = TemplateTags.hasVars(0);
