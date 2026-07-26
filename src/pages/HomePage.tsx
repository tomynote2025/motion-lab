import { Profile } from '../sections/Profile';
import { BodyMap } from '../sections/BodyMap';
import { ArticleList } from '../sections/ArticleList';
import { LabPromo } from '../sections/LabPromo';

export function HomePage() {
  return (
    <>
      <Profile />
      <BodyMap />
      <ArticleList limit={6} />
      <LabPromo />
    </>
  );
}
