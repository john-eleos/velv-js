"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = isCommonJS;
function isCommonJS() {
    return typeof require !== "undefined" && typeof module !== "undefined" && module.exports;
}
