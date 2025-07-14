#!/bin/sh

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
HTTP_STATUS=$(curl -X POST \
  -s \
  -w "%{http_code}" \
  -o /tmp/response.txt \
  "$JOBBER_NOTEE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: $JOBBER_NOTEE_AUTH" \
  -d "{\"tag\": \"$VERSION\"}")

echo "HTTP Status: $HTTP_STATUS"
echo "Response: $(cat /tmp/response.txt)"

if [ "$HTTP_STATUS" -ne 200 ] && [ "$HTTP_STATUS" -ne 201 ]; then
  echo "Release process failed with HTTP status $HTTP_STATUS"
  exit 1
fi