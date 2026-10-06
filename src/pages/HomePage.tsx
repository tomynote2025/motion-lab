import { Profile } from '../sections/Profile';
import { BodyMap } from '../sections/BodyMap';
import { LabPromo } from '../sections/LabPromo';
import { PersonalTrainingPromo } from '../sections/PersonalTrainingPromo';

export function HomePage() {
  return (
    <>
      <Profile />
      <PersonalTrainingPromo />
      <BodyMap />
      <LabPromo />
    </>
  );
}
