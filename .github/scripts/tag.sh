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

# Trigger release process
echo "Triggering release process"
curl -X POST \
  -s \
  "$JOBBER_NOTEE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: $JOBBER_NOTEE_AUTH" \
  -d "{\"tag\": \"$VERSION\"}"

RELEASE_STATUS=$?

if [ $RELEASE_STATUS -ne 0 ]; then
  echo "Release process failed with status $RELEASE_STATUS"
  exit $RELEASE_STATUS
fi