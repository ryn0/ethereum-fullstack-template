import { Container, CssBaseline, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Fragment } from 'react';


const PanelWrapper = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  textAlign: 'center',
  color: theme.palette.text.secondary,
  height: '80vh',
  lineHeight: '60px',
  padding: '1rem',
  marginTop: '5%',
  background: '#5ae7ab'
}));

function Panel({ children }) {
  return (
    <div>
      <CssBaseline />
      <Container maxWidth="lg">
        <PanelWrapper elevation={4}>
          <Fragment>
            {children}
          </Fragment>
        </PanelWrapper>
      </Container>
    </div>
  );
}

export default Panel;