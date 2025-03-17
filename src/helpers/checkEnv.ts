export default function isCommonJS() {
    return typeof require !== "undefined" && typeof module !== "undefined" && module.exports;
}