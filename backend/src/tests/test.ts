import test from 'ava'

// NOTE: This is just an example test file, to be deleted later
test('foo', t => {
    t.pass()
})

test('bar', async t => {
    const bar = Promise.resolve('bar')
    t.is(await bar, 'bar')
})
