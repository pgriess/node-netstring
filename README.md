A braindead module for reading and writing
[netstrings](http://cr.yp.to/proto/netstrings.txt).

## API
    nsWriteLength(len)

Compute the number of bytes to required serialize a netstring with the `len`
bytes.

    nsWrite(pay, payStart = 0, payEnd = pay.length, buf = undefined, bufOff = 0)

Write the payload `pay ` out in netstring format, returning a string. The
`payStart` and `payEnd` parameters allow specifying a range for the payload
and default to the entire object. Like `Buffer.slice()`, this `payStart` is
inclusive and `payEnd` is exclusive. The `pay` parameter can be either a
string or a `Buffer` object.

If the `buf` parameter is specified, the netstring is written to this buffer
rather than returned as a string. The `bufOff` parameter allows specifying
the offset into the buffer at which to begin writing. The length of the
resulting netstring in bytes is returned.

    nsPayload(buf, off = 0)

Get the payload of the netstring pointed to by the given `buf` object at
offset `off`. Despite its name, `buf`, can be either a string or a `Buffer`.
The returned value will be of the same type as the `buf` parameter or a
negative integer value in following the error taxonomy of
`nsPayloadLength()`.

    nsPayloadLength(buf, off = 0)

Get the length of the payload pointed to by the given `buf` object at offset
`off`. Despite its name, `buf`, can be either a string or a `Buffer`. The
length returned is only that of the payload; it does not include the header
or footer. The returned value will be -1 if the buffer does not include
enough data to make a complete length calculation.

    nsLength(buf, off = 0)

Get the length of the netstring pointed to by the given `buf` object at
offset `off`. Despite its name, `buf`, can be either a string or a `Buffer`.
The length returned includes the length of the header and footer in addition
to the payload. Negative values follow the taxonomy from `nsPayloadLength()`.
