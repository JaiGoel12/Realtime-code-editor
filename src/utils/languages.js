// Supported programming languages
export const LANGUAGES = [
    { value: 'javascript', label: 'JavaScript', mime: 'text/javascript' },
    { value: 'python', label: 'Python', mime: 'text/x-python' },
    { value: 'java', label: 'Java', mime: 'text/x-java' },
    { value: 'cpp', label: 'C++', mime: 'text/x-c++src' },
    { value: 'c', label: 'C', mime: 'text/x-csrc' },
    { value: 'html', label: 'HTML', mime: 'text/html' },
    { value: 'css', label: 'CSS', mime: 'text/css' },
    { value: 'xml', label: 'XML', mime: 'application/xml' },
    { value: 'json', label: 'JSON', mime: 'application/json' },
    { value: 'sql', label: 'SQL', mime: 'text/x-sql' },
    { value: 'php', label: 'PHP', mime: 'text/x-php' },
    { value: 'ruby', label: 'Ruby', mime: 'text/x-ruby' },
    { value: 'go', label: 'Go', mime: 'text/x-go' },
    { value: 'rust', label: 'Rust', mime: 'text/x-rustsrc' },
    { value: 'swift', label: 'Swift', mime: 'text/x-swift' },
    { value: 'typescript', label: 'TypeScript', mime: 'application/typescript' },
];

export function getLanguageMode(language) {
    const lang = LANGUAGES.find(l => l.value === language);
    return lang ? lang.mime : 'text/plain';
}

