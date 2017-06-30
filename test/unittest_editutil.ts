import {assert} from "chai";

import * as editutil from "../src/editutil";

describe("Extension Tests", () => {
    // Defines a Mocha unit test
    it('should not detect whitespace ranges inside strings', () => {
        assert.equal(null, editutil.whitespaceRange("hello  world", 1));
        assert.equal(null, editutil.whitespaceRange("hello world", 0));
        assert.equal(null, editutil.whitespaceRange("hello ", 4));
    });

    it('should detect whitespace ranges at the beginning of the line', () => {
        assert.deepEqual([0, 3], editutil.whitespaceRange("   hello  world", 0));
        assert.deepEqual([0, 3], editutil.whitespaceRange("   hello  world", 1));
    });

    it('should detect whitespace ranges in the middle of a whitespace range', () => {
        assert.deepEqual([5, 7], editutil.whitespaceRange("hello  world", 5));
        assert.deepEqual([5, 7], editutil.whitespaceRange("hello  world", 6));
        assert.deepEqual([5, 7], editutil.whitespaceRange("hello  world", 7));
        assert.deepEqual([5, 14], editutil.whitespaceRange("hello         world", 6));
    });

    it("should detect whitespace ranges on the first letter following a space", () => {
        assert.deepEqual([5, 7], editutil.whitespaceRange("hello  world", 7));
    });

    it('should detect whitespace ranges at the end of the line', () => {
        assert.deepEqual([5, 6], editutil.whitespaceRange("hello ", 5));
        assert.deepEqual([5, 7], editutil.whitespaceRange("hello  ", 5));
        assert.deepEqual([5, 7], editutil.whitespaceRange("hello  ", 6));
    });
});
