module.exports = {
    "extends": "eslint:recommended",
    "env": {
        "node": true,
        "es6": true,
    },
    "parserOptions": {
      "ecmaVersion": 8,
    },
    "plugins": [
        "promise",
    ],
    "rules": {
        "strict": ["error", "global"],

        "indent": ["error", 4],
        "linebreak-style": ["error", "unix"],
        "eqeqeq": ["error", "smart"],
        "quotes": ["error", "single"],
        "semi": ["error", "always"],

        "no-console": "off",

        "no-const-assign": "error",

        "prefer-arrow-callback": 1,
        "dot-notation": [2, {"allowKeywords": true}],
        "no-use-before-define": 0,
        "no-unused-vars": [1, { "varsIgnorePattern": "^self$" }],
        "yoda": [2, "never"],
        "no-alert": 2,
        "no-this-before-super": 2,
        "no-unexpected-multiline": 2,
        "no-var": 1,
        "no-warning-comments": 0,
        "no-undef": 2,
        "promise/param-names": 1,
        "promise/catch-or-return": 1
    },
};
