class TemplateTags {
    // Let typescript infer return value. (Seems to be impossible to declare it the right way in standard JSDoc)
    // eslint-disable-next-line valid-jsdoc
    /**
     * @template {number} T
     * @param {T} variableCount
     *
     */
    static hasVariables(variableCount) {
        return (
            /** @type {TemplateStringsArray} */ strings,
            /** @type {(string | number)[] & { length: T }} */ ...expressions
        ) => {
            if (strings.length !== variableCount + 1) {
                throw new Error('Illegal variable use');
            }

            let output = strings[0];
            expressions.forEach((expression, index) => {
                output += expression + strings[index];
            });

            return output;
        };
    }
}

TemplateTags.noVariables = TemplateTags.hasVariables(0);
