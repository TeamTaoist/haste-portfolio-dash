
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setDeviceType } from '../../../store/device/deviceSlice';

const DeviceDetector: React.FC = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleResize = () => {
      const deviceType = window.innerWidth <= 768 ? 'mobile' : 'desktop';
      dispatch(setDeviceType(deviceType));
    };

    // initial detector
    handleResize();

    //observe window size change
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  return null;
};

export default DeviceDetector;
