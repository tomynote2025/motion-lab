import { useEffect } from 'react';
import { ArticleList } from '../sections/ArticleList';

export function BlogPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="page-top-pad">
      <ArticleList />
    </div>
  );
}
