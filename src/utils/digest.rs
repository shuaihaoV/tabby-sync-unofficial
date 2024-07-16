use sha2::{ Sha512, Digest};

#[test]
fn test_sha512() {
    let data = b"a06ea296d838e7f1b476914f0c3ea35e30b87506cf9a7b070feadabe378b9f20";
    let result = sha512(data);
    assert_eq!(result, "98fb02492d01ef0263057b67fda031f06bcd350475bfdc5e0af9447ea1063e57f4034de18c8e7ba8abde99adce5b02fe216b78234e2e8ccab1c79f2319a63492");
}

pub fn sha512(data: &[u8]) -> String {
    let mut hasher = Sha512::new();
    hasher.update(data);
    let result = hasher.finalize();
    format!("{:x}", result)
}
