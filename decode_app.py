import re

html = open('/home/machine01/Workspace/sundar-traders-crackers/wrapper.html').read()
key = r'\\x22userHtml\\x22:\\x22'
m = re.search(key, html)
assert m, 'key not found'
start = m.end()
# end marker: \x22,\x22sandboxHost\x22
endkey = r'\\x22,\\x22sandboxHost\\x22'
j = html.find(endkey, start)
# fallback: the raw text uses double backslash? try single-backslash form too
if j < 0:
    j = html.find('sandboxHost', start)
print('start', start, 'end', j, 'enclen', j - start)

enc = html[start:j]

# decode \xNN
def dec_x(mo):
    return chr(int(mo.group(1), 16))
s1 = re.sub(r'\\x([0-9a-fA-F]{2})', dec_x, enc)
# now s1 has sequences like \\n \\" \\/ (double-backslash because original was double-escaped)
s2 = s1.replace('\\\\n', '\n').replace('\\\\"', '"').replace("\\'", "'")
s2 = s2.replace('\\n', '\n').replace('\\"', '"').replace('\\/', '/')
# end marker: </html> in final text closes the app; drop wrapper tail
html_end_marker = s2.find('</html>')
print('html end at (final coords)', html_end_marker)
s2 = s2[:html_end_marker + len('</html>')]
print('trimmed decoded len', len(s2))
open('/home/machine01/Workspace/sundar-traders-crackers/sundar_app.html', 'w').write(s2)
print('saved')
print(s2[len(s2)-500:])
