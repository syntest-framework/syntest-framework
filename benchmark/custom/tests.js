
// function test (x) {
//   return '' + x
// }

function test (x) {
  if (x > 10) {
    return '0'
  }
  return '' + x
}


function test_func (func) {
  if (func() > 10) {
    return '0'
  }
  return '1'
}
module.exports = {test, test_func}
