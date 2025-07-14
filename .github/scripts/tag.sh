#/bin/sh

echo "Installing git-cliff"
npm install -g git-cliff@2.9.1

echo "Git setup..."
git config --global user.name "Eithan CI"
git config --global user.email "github-ci@eithan.me"

echo "Git fetch..."
git fetch --tags

VERSION=$(npx git-cliff --bumped-version)
echo "Next version $VERSION"

echo "Tagging branch version $VERSION"
git tag -a $VERSION -m "Version $VERSION"

echo "Pushing tags"
git push origin $VERSION
