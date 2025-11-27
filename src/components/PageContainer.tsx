import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
}) => {
  return (
    <div className={`max-w-7xl mx-auto py-12 ${className}`}>{children}</div>
  );
};

export default PageContainer;
