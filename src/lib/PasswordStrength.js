class PasswordStrength { // eslint-disable-line no-unused-vars
    /**
     * Scores below 30 are considered 'weak', scores from 75 are 'strong',
     * scores above 150 are 'secure'.
     *
     * @param {string} password
     * @param {number} [minLength = 8]
     * @returns {number}
     */
    static strength(password, minLength = 8) {
        /*
        The code for this password strength function was taken (and adapted) from
        https://github.com/nourabusoud/password-genie and usage is granted under
        the following MIT license:

        Copyright (c) 2018 Nour Soud

        Permission is hereby granted, free of charge, to any person obtaining a copy
        of this software and associated documentation files (the "Software"), to deal
        in the Software without restriction, including without limitation the rights
        to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
        copies of the Software, and to permit persons to whom the Software is
        furnished to do so, subject to the following conditions:

        The above copyright notice and this permission notice shall be included in all
        copies or substantial portions of the Software.
        */

        const count = {
            excess: 0,
            upperCase: 0,
            numbers: 0,
            symbols: 0,
        };

        const weight = {
            excess: 3,
            upperCase: 4,
            numbers: 5,
            symbols: 5,
            combo: 0,
            flatLower: 0,
            flatNumber: 0,
        };

        const baseScore = 30;

        for (let i = 0; i < password.length; i++) {
            if (password.charAt(i).match(/[A-Z]/g)) { count.upperCase += 1; }
            if (password.charAt(i).match(/[0-9]/g)) { count.numbers += 1; }
            if (password.charAt(i).match(/(.*[!,@,#,$,%,^,&,*,?,_,~])/)) { count.symbols += 1; }
        }

        count.excess = password.length - minLength;

        if (count.upperCase && count.numbers && count.symbols) {
            weight.combo = 25;
        } else if ((count.upperCase && count.numbers)
            || (count.upperCase && count.symbols)
            || (count.numbers && count.symbols)) {
            weight.combo = 15;
        }

        if (password.match(/^[\sa-z]+$/)) {
            weight.flatLower = -30;
        }

        if (password.match(/^[\s0-9]+$/)) {
            weight.flatNumber = -50;
        }

        const score = baseScore
            + (count.excess * weight.excess)
            + (count.upperCase * weight.upperCase)
            + (count.numbers * weight.numbers)
            + (count.symbols * weight.symbols)
            + weight.combo
            + weight.flatLower
            + weight.flatNumber;

        // score < 30          => weak
        // 30 <= score < 75    => average
        // 75 <= score < 150   => strong
        // 150 <= score        => secure

        return score;
    }
}
